import { ExportButton } from '@/components/reports/ExportButton';
import { KPICard } from '@/components/reports/KPICard';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { TrendChart } from '@/components/reports/TrendChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Calendar, CheckCircle, RefreshCw, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface ComplianceData {
    capital_adequacy_ratio: number;
    rbc_ratio: number;
    minimum_capital_requirement: number;
    available_capital: number;
    compliance_score: number;
    outstanding_submissions: number;
    upcoming_deadlines: number;
}

interface ComplianceTrend {
    date: string;
    ratio: number;
    target: number;
}

interface SubmissionHistory {
    id: number;
    report_type: string;
    submission_date: string;
    status: string;
    deadline: string;
}

interface Props {
    data: ComplianceData;
    trends: {
        premium_trends: ComplianceTrend[];
    };
    submissionHistory: SubmissionHistory[];
    period: string;
    startDate: string;
    endDate: string;
}

export default function ComplianceDashboard({ data, trends, submissionHistory, period, startDate, endDate }: Props) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = () => {
        setIsGenerating(true);
        router.get(
            '/reports/compliance-dashboard',
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

    const getComplianceStatus = (ratio: number, target: number) => {
        if (ratio >= target * 1.2) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
        if (ratio >= target) return { status: 'compliant', color: 'text-green-600', bg: 'bg-green-100' };
        if (ratio >= target * 0.8) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
    };

    const capitalStatus = getComplianceStatus(data.capital_adequacy_ratio, 100);
    const rbcStatus = getComplianceStatus(data.rbc_ratio, 100);

    const kpiCards = [
        {
            title: 'Capital Adequacy Ratio',
            value: `${data.capital_adequacy_ratio.toFixed(1)}%`,
            icon: Shield,
            trend: {
                value: 5.2,
                isPositive: true,
                label: 'vs last period',
            },
            status: capitalStatus.status as any,
        },
        {
            title: 'RBC Ratio',
            value: `${data.rbc_ratio.toFixed(1)}%`,
            icon: CheckCircle,
            trend: {
                value: 3.1,
                isPositive: true,
                label: 'vs last period',
            },
            status: rbcStatus.status as any,
        },
        {
            title: 'Available Capital',
            value: formatCurrency(data.available_capital),
            icon: TrendingUp,
            trend: {
                value: 8.7,
                isPositive: true,
                label: 'vs last period',
            },
        },
        {
            title: 'Compliance Score',
            value: `${data.compliance_score.toFixed(1)}/10`,
            icon: CheckCircle,
            trend: {
                value: 1.2,
                isPositive: true,
                label: 'vs last period',
            },
        },
    ];

    const complianceMetrics = [
        {
            title: 'Outstanding Submissions',
            value: data.outstanding_submissions.toString(),
            subtitle: 'Reports pending submission',
            status: data.outstanding_submissions > 0 ? ('error' as const) : ('success' as const),
        },
        {
            title: 'Upcoming Deadlines',
            value: data.upcoming_deadlines.toString(),
            subtitle: 'Deadlines in next 30 days',
            status: data.upcoming_deadlines > 3 ? ('warning' as const) : ('success' as const),
        },
        {
            title: 'MCR Compliance',
            value: data.available_capital >= data.minimum_capital_requirement ? 'Compliant' : 'Non-Compliant',
            subtitle: `Required: ${formatCurrency(data.minimum_capital_requirement)}`,
            status: data.available_capital >= data.minimum_capital_requirement ? ('success' as const) : ('error' as const),
        },
    ];

    const complianceTrendData = trends.premium_trends.map((trend) => ({
        date: trend.date,
        ratio: trend.ratio,
        target: trend.target,
    }));

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            submitted: { color: 'bg-green-100 text-green-800', label: 'Submitted' },
            pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' },
            draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        return (
            <Badge variant="outline" className={config.color}>
                {config.label}
            </Badge>
        );
    };

    return (
        <AppLayout>
            <Head title="Compliance Dashboard" />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h2>
                        <p className="text-muted-foreground">Regulatory compliance tracking and capital adequacy monitoring</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {startDate} to {endDate}
                            </span>
                        </div>
                        <ExportButton reportType="compliance-dashboard" period={selectedPeriod} />
                    </div>
                </div>

                {/* Report Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Report Configuration
                        </CardTitle>
                        <CardDescription>Configure the reporting period and generate compliance dashboard</CardDescription>
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
                        <KPICard key={index} title={kpi.title} value={kpi.value} icon={kpi.icon} trend={kpi.trend} status={kpi.status} />
                    ))}
                </div>

                {/* Compliance Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {complianceMetrics.map((metric, index) => (
                        <KPICard key={index} title={metric.title} value={metric.value} subtitle={metric.subtitle} status={metric.status} />
                    ))}
                </div>

                {/* Compliance Progress */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Capital Adequacy Progress</CardTitle>
                            <CardDescription>Current capital adequacy ratio vs regulatory requirements</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Current Ratio</span>
                                    <span className="font-semibold">{data.capital_adequacy_ratio.toFixed(1)}%</span>
                                </div>
                                <Progress value={Math.min(data.capital_adequacy_ratio, 150)} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Minimum: 100%</span>
                                    <span>Target: 120%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>RBC Framework Compliance</CardTitle>
                            <CardDescription>Risk-Based Capital ratio tracking</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">RBC Ratio</span>
                                    <span className="font-semibold">{data.rbc_ratio.toFixed(1)}%</span>
                                </div>
                                <Progress value={Math.min(data.rbc_ratio, 150)} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Minimum: 100%</span>
                                    <span>Target: 120%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Compliance Trends */}
                <TrendChart
                    title="Compliance Ratio Trends"
                    description="Capital adequacy and RBC ratios over time"
                    data={complianceTrendData.map((trend) => ({
                        date: trend.date,
                        value: trend.ratio,
                    }))}
                    dataKey="value"
                    color="hsl(var(--chart-1))"
                />

                {/* Submission History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Submission History</CardTitle>
                        <CardDescription>Recent regulatory submissions and their status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left">Report Type</th>
                                        <th className="px-4 py-3 text-left">Submission Date</th>
                                        <th className="px-4 py-3 text-left">Deadline</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissionHistory.map((submission, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{submission.report_type}</td>
                                            <td className="px-4 py-3">{submission.submission_date}</td>
                                            <td className="px-4 py-3">{submission.deadline}</td>
                                            <td className="px-4 py-3">{getStatusBadge(submission.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Compliance Alerts */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                                Compliance Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Overall Score</span>
                                    <span className="font-semibold text-green-600">{data.compliance_score.toFixed(1)}/10</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Capital Status</span>
                                    <span className={`font-semibold ${capitalStatus.color}`}>
                                        {capitalStatus.status.charAt(0).toUpperCase() + capitalStatus.status.slice(1)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">RBC Status</span>
                                    <span className={`font-semibold ${rbcStatus.color}`}>
                                        {rbcStatus.status.charAt(0).toUpperCase() + rbcStatus.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                                Alerts & Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Outstanding Reports</span>
                                    <span className="font-semibold text-red-600">{data.outstanding_submissions}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Upcoming Deadlines</span>
                                    <span className="font-semibold text-yellow-600">{data.upcoming_deadlines}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Critical Alerts</span>
                                    <span className="font-semibold text-red-600">0</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="mr-2 h-5 w-5 text-blue-600" />
                                Capital Requirements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Available Capital</span>
                                    <span className="font-semibold">{formatCurrency(data.available_capital)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">MCR Required</span>
                                    <span className="font-semibold">{formatCurrency(data.minimum_capital_requirement)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Surplus/Deficit</span>
                                    <span
                                        className={`font-semibold ${
                                            data.available_capital >= data.minimum_capital_requirement ? 'text-green-600' : 'text-red-600'
                                        }`}
                                    >
                                        {formatCurrency(data.available_capital - data.minimum_capital_requirement)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
