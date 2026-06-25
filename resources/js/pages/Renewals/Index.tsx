import { Can } from '@/components/auth/permission-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, CalendarDays, CheckCircle, Clock, MoreHorizontal, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useCanSms } from '@/hooks/use-plan';

interface Policy {
    id: number;
    policy_number: string;
    customer: {
        first_name: string;
        last_name: string;
        email: string;
    };
    expiry_date: string;
    premium_amount: number;
    status: string;
    renewed_at: string | null;
    policyClass?: {
        name: string;
    };
    auto_renewal_notification: boolean;
}

interface RenewalStats {
    upcoming_count: number;
    overdue_count: number;
    renewed_this_month: number;
    total_active: number;
}

interface RenewalsIndexProps extends PageProps {
    renewals: {
        data: Policy[];
        links: any[];
        meta: any;
    };
    stats: RenewalStats;
    filters: {
        search?: string;
        filter: string;
    };
}

export default function RenewalsIndex({ renewals, stats, filters }: RenewalsIndexProps) {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Renewals', href: '#' },
    ];

    const { canUseSms, upgradeUrl } = useCanSms();

    const getStatusBadge = (policy: Policy) => {
        const endDate = new Date(policy.expiry_date);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (policy.renewed_at) {
            return (
                <Badge variant="outline" className="border-green-300 text-green-700">
                    Renewed
                </Badge>
            );
        } else if (daysUntilExpiry < 0) {
            return <Badge variant="destructive">Overdue</Badge>;
        } else if (daysUntilExpiry <= 60) {
            return (
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                    Due Soon
                </Badge>
            );
        } else {
            return <Badge variant="outline">All</Badge>;
        }
    };

    const toggleAutoNotify = (policyId: number) => {
        router.put(
            route('renewals.toggle-auto-renewal', { policy: policyId }),
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as { success?: string; error?: string };
                    if (flash?.success) toast.success(flash.success);
                    if (flash?.error) toast.error(flash.error);
                },
                onError: () => toast.error('Failed to update auto-renewal settings'),
            },
        );
    };

    const sendNotice = (policyId: number, channel: string) => {
        router.post(
            route('renewals.send-notice', { policy: policyId }),
            { channel },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as { success?: string; error?: string };
                    if (flash?.success) toast.success(flash.success);
                    if (flash?.error) toast.error(flash.error);
                },
                onError: () => toast.error('Failed to send notification request'),
            },
        );
    };

    const sendNoticeToAllChannels = (policyId: number) => {
        router.post(
            route('renewals.send-notice-all', { policy: policyId }),
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as { success?: string; error?: string };
                    if (flash?.success) toast.success(flash.success);
                    if (flash?.error) toast.error(flash.error);
                },
                onError: () => toast.error('Failed to send notification request'),
            },
        );
    };

    const handleFilterChange = (value: string) => {
        router.get(route('renewals.index'), { filter: value, search: filters.search }, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Policy Renewals" />

            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Policy Renewals</h1>
                            <p className="text-muted-foreground">Monitor and manage policy renewals</p>
                        </div>

                        <div className="flex gap-2">
                            <Can permission="process_renewals">
                                <Button variant="outline">Send Reminders</Button>
                            </Can>
                            <Can permission="create_policies">
                                <Link href={route('renewals.create')}>
                                    <Button>Process Renewals</Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.upcoming_count}</div>
                                <p className="text-xs text-muted-foreground">Next 60 days</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                                <AlertCircle className="h-4 w-4 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-destructive">{stats.overdue_count}</div>
                                <p className="text-xs text-muted-foreground">Past expiry date</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Renewed This Month</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.renewed_this_month}</div>
                                <p className="text-xs text-muted-foreground">Successfully renewed</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Active</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_active}</div>
                                <p className="text-xs text-muted-foreground">Active policies</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Renewals Table */}
                    <Card>
                        <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle>Policy Renewals</CardTitle>
                                <CardDescription>Track renewal status and manage policy renewals</CardDescription>
                            </div>

                            <Tabs value={filters.filter || 'all'} onValueChange={handleFilterChange} className="w-full sm:w-auto">
                                <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                                    <TabsTrigger value="overdue">Overdue</TabsTrigger>
                                    <TabsTrigger value="renewed">Renewed</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent>
                            {renewals.data.length > 0 ? (
                                <div className="space-y-4">
                                    {renewals.data.map((policy) => (
                                        <div
                                            key={policy.id}
                                            className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <div className="flex-1">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <h3 className="font-medium">{policy.policy_number}</h3>
                                                    {getStatusBadge(policy)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {policy.customer.first_name} {policy.customer.last_name} - {policy.customer.email}
                                                </p>
                                                {policy.policyClass && <p className="text-sm text-muted-foreground">{policy.policyClass.name}</p>}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">₦{policy.premium_amount.toLocaleString()}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Expires: {new Date(policy.expiry_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="ml-4 flex items-center gap-2">
                                                <div className="mr-2 flex items-center gap-2">
                                                    <Switch
                                                        checked={policy.auto_renewal_notification}
                                                        onCheckedChange={() => toggleAutoNotify(policy.id)}
                                                    />
                                                    <Label className="hidden text-xs whitespace-nowrap sm:inline-block">Auto Notify</Label>
                                                </div>

<DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Notify
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => sendNoticeToAllChannels(policy.id)}>
                                                            To All Channels
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => sendNotice(policy.id, 'email')}>
                                                            Send via Email
                                                        </DropdownMenuItem>
                                                        {canUseSms ? (
                                                            <DropdownMenuItem onClick={() => sendNotice(policy.id, 'sms')}>
                                                                Send via SMS
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => router.visit(upgradeUrl)}
                                                                className="text-muted-foreground cursor-not-allowed"
                                                            >
                                                                <AlertCircle className="mr-2 h-4 w-4" />
                                                                Send via SMS (Enterprise)
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => sendNotice(policy.id, 'portal')}>
                                                            Send via Portal
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <Can permission="view_policies">
                                                    <Link href={route('renewals.show', { policy: policy?.id })}>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </Can>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No renewals found</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">No policies matching the current filter criteria.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </>
    );
}
