import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Calendar,
    CheckCircle,
    DollarSign,
    Download,
    FileBarChart,
    FileText,
    PieChart,
    Shield,
    TrendingUp,
    Users,
} from 'lucide-react';
import React from 'react';

interface ReportCard {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    color: string;
    features: string[];
}

export default function ReportsIndex() {
    const reports: ReportCard[] = [
        {
            title: 'NAICOM Compliance Reports',
            description: 'Generate regulatory compliance reports required by the National Insurance Commission',
            icon: FileBarChart,
            href: 'reports.naicom',
            color: 'text-blue-600',
            features: [
                'Monthly, Quarterly & Annual reports',
                'Financial summary and statistics',
                'Policy breakdown by class of business',
                'Customer demographics',
                'Claims and reinsurance information',
                'Risk-Based Capital (RBC) framework',
                'PDF export for submission',
            ],
        },
        {
            title: 'Business Overview',
            description: 'Comprehensive overview of your insurance business performance and key metrics',
            icon: TrendingUp,
            href: 'reports.business-overview',
            color: 'text-green-600',
            features: [
                'Revenue and premium analytics',
                'Policy statistics and trends',
                'Commission tracking',
                'Renewal and cancellation rates',
                'Period-over-period comparisons',
                'Visual charts and graphs',
            ],
        },
        {
            title: 'Customer Analytics',
            description: 'Detailed insights into customer behavior, acquisition, and retention patterns',
            icon: Users,
            href: 'reports.customer-analytics',
            color: 'text-purple-600',
            features: [
                'Customer acquisition trends',
                'Retention rate analysis',
                'Individual vs Corporate breakdown',
                'Top customers by premium',
                'Geographic distribution',
                'Customer lifetime value',
            ],
        },
        {
            title: 'Product Performance',
            description: 'Analysis of insurance product performance and profitability metrics',
            icon: Shield,
            href: 'reports.product-performance',
            color: 'text-orange-600',
            features: [
                'Product-wise premium collection',
                'Policy count by product type',
                'Average premium per product',
                'Commission by product',
                'Performance trends over time',
                'Profitability analysis',
            ],
        },
        {
            title: 'Claims Analytics',
            description: 'Comprehensive analysis of claims processing and settlement metrics',
            icon: AlertTriangle,
            href: 'reports.claims-analytics',
            color: 'text-red-600',
            features: [
                'Claims processing metrics',
                'Settlement ratio analysis',
                'Claims by type breakdown',
                'Processing efficiency tracking',
                'Risk indicators',
                'Quality metrics',
            ],
        },
        {
            title: 'Financial Analytics',
            description: 'Revenue trends, expense ratios, and profitability analysis',
            icon: DollarSign,
            href: 'reports.financial-analytics',
            color: 'text-emerald-600',
            features: [
                'Revenue and expense trends',
                'Loss ratio analysis',
                'Combined ratio calculation',
                'Cash flow visualization',
                'Outstanding premiums aging',
                'Financial forecasting',
            ],
        },
        {
            title: 'Compliance Dashboard',
            description: 'Regulatory compliance tracking and capital adequacy monitoring',
            icon: CheckCircle,
            href: 'reports.compliance-dashboard',
            color: 'text-indigo-600',
            features: [
                'Capital adequacy status',
                'RBC framework compliance',
                'Regulatory deadlines',
                'Submission history',
                'Compliance alerts',
                'Audit trail',
            ],
        },
    ];

    const quickStats = [
        { label: 'Available Reports', value: '7', icon: FileText },
        { label: 'Report Categories', value: '7', icon: PieChart },
        { label: 'Export Formats', value: '2', icon: Download },
        { label: 'Data Sources', value: '8', icon: BarChart3 },
    ];

    return (
        <AppLayout>
            <Head title="Reports & Analytics" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
                        <p className="text-muted-foreground">Regulatory compliance reports and submissions</p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Last updated: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                    {quickStats.map((stat, index) => (
                        <Card key={index}>
                            <CardContent className="flex items-center p-6">
                                <stat.icon className="mr-4 h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Introduction */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="mr-2 h-6 w-6 text-blue-600" />
                            Reports & Analytics Dashboard
                        </CardTitle>
                        <CardDescription>
                            Generate comprehensive reports for regulatory compliance, business insights, and performance analysis. All reports can be
                            exported as PDF or Excel files and are designed to meet Nigerian insurance industry standards.
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Report Cards Grid */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {reports.map((report, index) => (
                        <Card key={index} className="transition-shadow duration-200 hover:shadow-lg">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <report.icon className={`mr-3 h-8 w-8 ${report.color}`} />
                                        <div>
                                            <CardTitle className="text-lg">{report.title}</CardTitle>
                                            <CardDescription className="mt-1">{report.description}</CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="mb-2 text-sm font-semibold text-gray-700">Features Include:</h4>
                                        <ul className="space-y-1">
                                            {report.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                                                    <div className="mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="border-t pt-4">
                                        <Link href={`/${report.href.replace('.', '/')}`}>
                                            <Button className="group w-full">
                                                Generate Report
                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Additional Information */}
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Shield className="mr-2 h-5 w-5 text-blue-600" />
                                Regulatory Compliance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-gray-600">
                                Our reports are designed to meet NAICOM (National Insurance Commission) requirements and other Nigerian regulatory
                                standards.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center">
                                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-400"></div>
                                    NAICOM reporting standards
                                </li>
                                <li className="flex items-center">
                                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-400"></div>
                                    Automated compliance checks
                                </li>
                                <li className="flex items-center">
                                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-400"></div>
                                    Professional formatting
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Download className="mr-2 h-5 w-5 text-green-600" />
                                Export Options
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-gray-600">Export your reports in multiple formats for different use cases and stakeholders.</p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center">
                                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                                    PDF for official submissions
                                </li>
                                <li className="flex items-center">
                                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                                    Excel for data analysis
                                </li>
                                <li className="flex items-center">
                                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                                    Automated scheduling
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
